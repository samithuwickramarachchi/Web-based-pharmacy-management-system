package com.pharmacy.common.service;

import com.pharmacy.auth.entity.User;
import com.pharmacy.auth.repository.UserRepository;
import com.pharmacy.common.entity.ActivityLog;
import com.pharmacy.common.repository.ActivityLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActivityLogService {

    private static final Logger log = LoggerFactory.getLogger(ActivityLogService.class);

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    public ActivityLogService(ActivityLogRepository activityLogRepository, UserRepository userRepository) {
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ActivityLog log(User user, String action, String entityType, Integer entityId, String details, String ipAddress) {
        try {
            ActivityLog activityLog = new ActivityLog();
            activityLog.setUser(user);
            activityLog.setAction(action);
            activityLog.setEntityType(entityType);
            activityLog.setEntityId(entityId);
            activityLog.setDetails(details);
            activityLog.setIpAddress(ipAddress);
            return activityLogRepository.saveAndFlush(activityLog);
        } catch (Exception e) {
            log.error("Failed to persist activity log for action {}: {}", action, e.getMessage());
            return null;
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ActivityLog log(Integer userId, String action, String entityType, Integer entityId, String details, String ipAddress) {
        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }
        return log(user, action, entityType, entityId, details, ipAddress);
    }
}
