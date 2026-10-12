package com.pharmacy.common.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharmacy.auth.entity.User;
import com.pharmacy.auth.repository.UserRepository;
import com.pharmacy.common.entity.ActivityLog;
import com.pharmacy.common.repository.ActivityLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Writes audit-log rows in their OWN transaction.
 *
 * Failures are caught OUTSIDE the inner transaction (via TransactionTemplate), so a failed
 * audit write can never mark the caller's transaction as rollback-only
 * ("Transaction silently rolled back because it has been marked as rollback-only").
 */
@Service
public class ActivityLogService {

    private static final Logger log = LoggerFactory.getLogger(ActivityLogService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final TransactionTemplate requiresNewTx;

    public ActivityLogService(ActivityLogRepository activityLogRepository,
                              UserRepository userRepository,
                              PlatformTransactionManager transactionManager) {
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
        this.requiresNewTx = new TransactionTemplate(transactionManager);
        this.requiresNewTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    public ActivityLog log(User user, String action, String entityType, Integer entityId, String details, String ipAddress) {
        try {
            final String safeDetails = toJson(details);
            return requiresNewTx.execute(status -> {
                ActivityLog activityLog = new ActivityLog();
                activityLog.setUser(user);
                activityLog.setAction(action);
                activityLog.setEntityType(entityType);
                activityLog.setEntityId(entityId);
                activityLog.setDetails(safeDetails);
                activityLog.setIpAddress(ipAddress);
                return activityLogRepository.saveAndFlush(activityLog);
            });
        } catch (Exception e) {
            log.error("Failed to persist activity log for action {}: {}", action, e.getMessage());
            return null;
        }
    }

    public ActivityLog log(Integer userId, String action, String entityType, Integer entityId, String details, String ipAddress) {
        User user = null;
        if (userId != null) {
            try {
                user = userRepository.findById(userId).orElse(null);
            } catch (Exception e) {
                log.warn("Could not resolve user {} for activity log: {}", userId, e.getMessage());
            }
        }
        return log(user, action, entityType, entityId, details, ipAddress);
    }

    /** The activity_logs.details column is JSON in MySQL; make sure we always send valid JSON. */
    private static String toJson(String details) {
        if (details == null || details.isBlank()) {
            return null;
        }
        String trimmed = details.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
            try {
                MAPPER.readTree(trimmed);
                return trimmed;
            } catch (Exception ignored) {
                // fall through and wrap as plain message
            }
        }
        try {
            Map<String, String> wrapper = new LinkedHashMap<>();
            wrapper.put("message", details);
            return MAPPER.writeValueAsString(wrapper);
        } catch (Exception e) {
            return "{}";
        }
    }
}
