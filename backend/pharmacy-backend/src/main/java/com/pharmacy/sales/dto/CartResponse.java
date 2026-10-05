package com.pharmacy.sales.dto;

import java.math.BigDecimal;
import java.util.List;

public class CartResponse {
    private Integer cartId;
    private Integer customerId;
    private List<CartItemDto> items;
    private BigDecimal totalAmount;

    public CartResponse() {}

    public Integer getCartId() { return cartId; }
    public void setCartId(Integer cartId) { this.cartId = cartId; }

    public Integer getCustomerId() { return customerId; }
    public void setCustomerId(Integer customerId) { this.customerId = customerId; }

    public List<CartItemDto> getItems() { return items; }
    public void setItems(List<CartItemDto> items) { this.items = items; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
}
