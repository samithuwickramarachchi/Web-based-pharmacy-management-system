package com.pharmacy.sales.controller;

import com.pharmacy.sales.dto.CartItemRequest;
import com.pharmacy.sales.dto.CartResponse;
import com.pharmacy.sales.service.ShoppingCartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class ShoppingCartController {

    private final ShoppingCartService cartService;

    public ShoppingCartController(ShoppingCartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping("/{customerId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CartResponse> getCart(@PathVariable Integer customerId) {
        return ResponseEntity.ok(cartService.getCart(customerId));
    }

    @PostMapping("/{customerId}/items")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CartResponse> addItemToCart(@PathVariable Integer customerId,
                                                      @Valid @RequestBody CartItemRequest req) {
        return ResponseEntity.ok(cartService.addItemToCart(customerId, req));
    }

    @PutMapping("/{customerId}/items/{itemId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CartResponse> updateItemQuantity(@PathVariable Integer customerId,
                                                           @PathVariable Integer itemId,
                                                           @RequestParam Integer quantity) {
        return ResponseEntity.ok(cartService.updateCartItemQuantity(customerId, itemId, quantity));
    }

    @DeleteMapping("/{customerId}/items/{itemId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CartResponse> removeItemFromCart(@PathVariable Integer customerId,
                                                           @PathVariable Integer itemId) {
        return ResponseEntity.ok(cartService.removeItemFromCart(customerId, itemId));
    }

    @DeleteMapping("/{customerId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> clearCart(@PathVariable Integer customerId) {
        cartService.clearCart(customerId);
        return ResponseEntity.noContent().build();
    }
}
