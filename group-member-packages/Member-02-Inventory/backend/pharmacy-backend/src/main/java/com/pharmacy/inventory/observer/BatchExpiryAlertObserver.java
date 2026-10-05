package com.pharmacy.inventory.observer;

import com.pharmacy.auth.entity.User;
import com.pharmacy.auth.repository.UserRepository;
import com.pharmacy.common.entity.Notification;
import com.pharmacy.common.repository.NotificationRepository;
import com.pharmacy.inventory.entity.Product;
import com.pharmacy.inventory.entity.ProductBatch;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Concrete Observer that monitors batch expiry dates and triggers warning notifications.
 */
@Component
public class BatchExpiryAlertObserver implements StockObserver {

    private static final Logger log = LoggerFactory.getLogger(BatchExpiryAlertObserver.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public BatchExpiryAlertObserver(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    public String getObserverName() {
        return "BatchExpiryAlertObserver";
    }

    @Override
    public void onStockChanged(StockEvent event) {
        ProductBatch batch = event.getBatch();
        Product product = event.getProduct();
        if (batch == null || product == null || batch.getExpiryDate() == null) {
            return;
        }

        LocalDate now = LocalDate.now();
        LocalDate expiry = batch.getExpiryDate();

        if (expiry.isBefore(now) || expiry.isBefore(now.plusDays(30))) {
            boolean isExpired = expiry.isBefore(now);
            String title = (isExpired ? "EXPIRED BATCH: " : "Expiring Batch Alert: ") + product.getName();
            String message = String.format("Batch '%s' for '%s' (Qty: %d) %s on %s.",
                    batch.getBatchNumber(), product.getName(), batch.getQuantity(),
                    isExpired ? "expired" : "will expire", expiry);

            log.warn("{}: {}", title, message);

            List<User> staffUsers = userRepository.findByRoleNames(List.of("ROLE_ADMIN", "ROLE_INVENTORY_STAFF", "ADMIN", "INVENTORY_STAFF"));
            if (staffUsers.isEmpty()) {
                userRepository.findAll().stream().findFirst().ifPresent(staffUsers::add);
            }

            for (User staff : staffUsers) {
                boolean exists = notificationRepository.findAll().stream()
                        .anyMatch(n -> Boolean.FALSE.equals(n.getIsRead())
                                && "EXPIRY_WARNING".equals(n.getType())
                                && Integer.valueOf(batch.getId()).equals(n.getRelatedEntityId())
                                && n.getUser() != null && n.getUser().getId().equals(staff.getId()));

                if (!exists) {
                    Notification notification = new Notification();
                    notification.setUser(staff);
                    notification.setTitle(title);
                    notification.setMessage(message);
                    notification.setType("EXPIRY_WARNING");
                    notification.setRelatedEntityType("BATCH");
                    notification.setRelatedEntityId(batch.getId());
                    notificationRepository.save(notification);
                }
            }
        }
    }
}
