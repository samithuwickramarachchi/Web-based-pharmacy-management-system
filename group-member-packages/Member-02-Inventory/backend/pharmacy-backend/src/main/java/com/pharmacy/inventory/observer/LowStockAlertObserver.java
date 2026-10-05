package com.pharmacy.inventory.observer;

import com.pharmacy.auth.entity.User;
import com.pharmacy.auth.repository.UserRepository;
import com.pharmacy.common.entity.Notification;
import com.pharmacy.common.repository.NotificationRepository;
import com.pharmacy.inventory.entity.Product;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Concrete Observer that monitors stock levels and triggers low-stock alerts.
 * Implements Functional Requirement #6 ("Low Stock Alerts").
 */
@Component
public class LowStockAlertObserver implements StockObserver {

    private static final Logger log = LoggerFactory.getLogger(LowStockAlertObserver.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public LowStockAlertObserver(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    public String getObserverName() {
        return "LowStockAlertObserver";
    }

    @Override
    public void onStockChanged(StockEvent event) {
        Product product = event.getProduct();
        if (product == null) return;

        Integer minLevel = product.getMinReorderLevel();
        if (minLevel == null || minLevel <= 0) {
            minLevel = 10; // Default safety threshold
        }

        int currentStock = event.getTotalProductStock();

        if (currentStock <= minLevel) {
            log.warn("LOW STOCK ALERT triggered for product '{}' (SKU: {}). Current stock: {}, Reorder level: {}",
                    product.getName(), product.getSku(), currentStock, minLevel);

            // Notify staff members (ADMIN, INVENTORY_STAFF, PHARMACIST)
            List<User> staffUsers = userRepository.findByRoleNames(List.of("ROLE_ADMIN", "ROLE_INVENTORY_STAFF", "ROLE_PHARMACIST", "ADMIN", "INVENTORY_STAFF"));
            if (staffUsers.isEmpty()) {
                userRepository.findAll().stream().findFirst().ifPresent(staffUsers::add);
            }

            for (User staff : staffUsers) {
                // Deduplicate: check if an unread notification for this product already exists
                boolean exists = notificationRepository.findAll().stream()
                        .anyMatch(n -> Boolean.FALSE.equals(n.getIsRead())
                                && "LOW_STOCK".equals(n.getType())
                                && Integer.valueOf(product.getId()).equals(n.getRelatedEntityId())
                                && n.getUser() != null && n.getUser().getId().equals(staff.getId()));

                if (!exists) {
                    Notification notification = new Notification();
                    notification.setUser(staff);
                    notification.setTitle("Low Stock Alert: " + product.getName());
                    notification.setMessage(String.format("Product '%s' is at %d units, below minimum reorder level of %d.",
                            product.getName(), currentStock, minLevel));
                    notification.setType("LOW_STOCK");
                    notification.setRelatedEntityType("PRODUCT");
                    notification.setRelatedEntityId(product.getId());
                    notificationRepository.save(notification);
                }
            }
        }
    }
}
