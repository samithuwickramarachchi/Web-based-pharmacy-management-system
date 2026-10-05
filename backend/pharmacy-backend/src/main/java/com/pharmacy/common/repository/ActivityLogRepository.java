package com.pharmacy.common.repository;

import com.pharmacy.common.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findByUserId(Integer userId);
    List<ActivityLog> findByEntityTypeAndEntityId(String entityType, Integer entityId);
    List<ActivityLog> findByAction(String action);
}
