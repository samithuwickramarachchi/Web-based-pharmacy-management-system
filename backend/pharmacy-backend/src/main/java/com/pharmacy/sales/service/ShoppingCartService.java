package com.pharmacy.sales.service;

import com.pharmacy.common.exception.BusinessException;
import com.pharmacy.common.exception.ResourceNotFoundException;
import com.pharmacy.customer.entity.Customer;
import com.pharmacy.customer.repository.CustomerRepository;
import com.pharmacy.inventory.entity.Product;
import com.pharmacy.inventory.entity.ProductBatch;
import com.pharmacy.inventory.repository.ProductBatchRepository;
import com.pharmacy.inventory.repository.ProductRepository;
import com.pharmacy.sales.dto.CartItemDto;
import com.pharmacy.sales.dto.CartItemRequest;
import com.pharmacy.sales.dto.CartResponse;
import com.pharmacy.sales.entity.CartItem;
import com.pharmacy.sales.entity.ShoppingCart;
import com.pharmacy.sales.repository.CartItemRepository;
import com.pharmacy.sales.repository.ShoppingCartRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ShoppingCartService {

    private final ShoppingCartRepository cartRepository;
    private final CartItemRepository itemRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final ProductBatchRepository batchRepository;

    public ShoppingCartService(ShoppingCartRepository cartRepository,
                               CartItemRepository itemRepository,
                               CustomerRepository customerRepository,
                               ProductRepository productRepository,
                               ProductBatchRepository batchRepository) {
        this.cartRepository = cartRepository;
        this.itemRepository = itemRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.batchRepository = batchRepository;
    }

    public CartResponse getCart(Integer customerId) {
        ShoppingCart cart = getOrCreateCart(customerId);
        return toDto(cart);
    }

    public CartResponse addItemToCart(Integer customerId, CartItemRequest req) {
        if (req.getQuantity() == null || req.getQuantity() <= 0) {
            throw new BusinessException("Item quantity must be greater than zero");
        }

        ShoppingCart cart = getOrCreateCart(customerId);
        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + req.getProductId()));

        if (product.getIsActive() != null && !product.getIsActive()) {
            throw new BusinessException("Product " + product.getName() + " is inactive and cannot be added to cart");
        }

        int availableStock = getAvailableStock(product.getId());
        if (availableStock <= 0) {
            throw new BusinessException("Product " + product.getName() + " is currently out of stock");
        }

        Optional<CartItem> existing = itemRepository.findByCartIdAndProductId(cart.getId(), product.getId());
        int newTotalQuantity = existing.map(ci -> ci.getQuantity() + req.getQuantity()).orElse(req.getQuantity());

        if (newTotalQuantity > availableStock) {
            throw new BusinessException("Cannot add " + req.getQuantity() + " unit(s). Only " + availableStock + " units are currently available.");
        }

        if (existing.isPresent()) {
            CartItem item = existing.get();
            item.setQuantity(newTotalQuantity);
            itemRepository.save(item);
        } else {
            CartItem item = new CartItem();
            item.setCart(cart);
            item.setProduct(product);
            item.setQuantity(req.getQuantity());
            cart.addItem(item);
            cartRepository.save(cart);
        }

        return toDto(cartRepository.findById(cart.getId()).orElse(cart));
    }

    public CartResponse updateCartItemQuantity(Integer customerId, Integer itemId, Integer quantity) {
        ShoppingCart cart = getOrCreateCart(customerId);
        CartItem item = itemRepository.findById(itemId)
                .filter(i -> i.getCart().getId().equals(cart.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id " + itemId));

        if (quantity == null || quantity <= 0) {
            cart.removeItem(item);
            itemRepository.delete(item);
        } else {
            int availableStock = getAvailableStock(item.getProduct().getId());
            if (quantity > availableStock) {
                throw new BusinessException("Cannot update quantity to " + quantity + ". Only " + availableStock + " units are currently available.");
            }
            item.setQuantity(quantity);
            itemRepository.save(item);
        }

        return toDto(cartRepository.findById(cart.getId()).orElse(cart));
    }

    public CartResponse removeItemFromCart(Integer customerId, Integer itemId) {
        ShoppingCart cart = getOrCreateCart(customerId);
        CartItem item = itemRepository.findById(itemId)
                .filter(i -> i.getCart().getId().equals(cart.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id " + itemId));

        cart.removeItem(item);
        itemRepository.delete(item);

        return toDto(cartRepository.findById(cart.getId()).orElse(cart));
    }

    public void clearCart(Integer customerId) {
        ShoppingCart cart = getOrCreateCart(customerId);
        itemRepository.deleteByCartId(cart.getId());
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private int getAvailableStock(Integer productId) {
        LocalDate today = LocalDate.now();
        return batchRepository.findActiveNonExpiredByProductId(productId, today)
                .stream().mapToInt(ProductBatch::getQuantity).sum();
    }

    private ShoppingCart getOrCreateCart(Integer customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id " + customerId));

        return cartRepository.findByCustomerId(customerId)
                .orElseGet(() -> {
                    ShoppingCart c = new ShoppingCart();
                    c.setCustomer(customer);
                    return cartRepository.save(c);
                });
    }

    private CartResponse toDto(ShoppingCart cart) {
        CartResponse dto = new CartResponse();
        dto.setCartId(cart.getId());
        dto.setCustomerId(cart.getCustomer().getId());

        List<CartItemDto> items = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        if (cart.getItems() != null) {
            for (CartItem ci : cart.getItems()) {
                CartItemDto idto = new CartItemDto();
                idto.setId(ci.getId());
                idto.setProductId(ci.getProduct().getId());
                idto.setProductName(ci.getProduct().getName());
                idto.setProductSku(ci.getProduct().getSku());
                idto.setQuantity(ci.getQuantity());

                int availableStock = getAvailableStock(ci.getProduct().getId());
                idto.setAvailableStock(availableStock);

                BigDecimal price = ci.getProduct().getSellingPrice() != null ? ci.getProduct().getSellingPrice() : BigDecimal.ZERO;
                idto.setUnitPrice(price);
                BigDecimal subtotal = price.multiply(BigDecimal.valueOf(ci.getQuantity()));
                idto.setSubtotal(subtotal);

                total = total.add(subtotal);
                items.add(idto);
            }
        }

        dto.setItems(items);
        dto.setTotalAmount(total);
        return dto;
    }
}
