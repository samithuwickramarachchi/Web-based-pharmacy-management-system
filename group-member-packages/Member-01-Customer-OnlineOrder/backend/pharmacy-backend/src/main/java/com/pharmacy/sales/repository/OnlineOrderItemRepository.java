package com.pharmacy.sales.repository;

import com.pharmacy.sales.entity.OnlineOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OnlineOrderItemRepository extends JpaRepository<OnlineOrderItem, Integer> {
    List<OnlineOrderItem> findByOnlineOrderId(Integer onlineOrderId);
    List<OnlineOrderItem> findByProductId(Integer productId);
}
