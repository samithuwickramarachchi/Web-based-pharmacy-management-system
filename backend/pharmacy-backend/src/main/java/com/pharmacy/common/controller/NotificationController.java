package com.pharmacy.common.controller;

import com.pharmacy.auth.security.CustomUserDetails;
import com.pharmacy.common.dto.NotificationDto;
import com.pharmacy.common.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller exposing the in-app notification system to the frontend.
 * All endpoints require an authenticated JWT — the user only sees their own notifications.
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * GET /api/notifications
     * Returns all notifications for the authenticated user (newest first).
     */
    @GetMapping
    public ResponseEntity<List<NotificationDto>> getMyNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(notificationService.getNotificationsForUser(userDetails.getId()));
    }

    /**
     * GET /api/notifications/unread
     * Returns only unread notifications for the authenticated user.
     */
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDto>> getMyUnreadNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(notificationService.getUnreadNotificationsForUser(userDetails.getId()));
    }

    /**
     * GET /api/notifications/count
     * Returns the unread notification count for the badge.
     */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        long count = notificationService.getUnreadCount(userDetails.getId());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    /**
     * PATCH /api/notifications/{id}/read
     * Marks a single notification as read.
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationDto> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(notificationService.markAsRead(id, userDetails.getId()));
    }

    /**
     * PATCH /api/notifications/read-all
     * Marks all of the authenticated user's notifications as read.
     */
    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        notificationService.markAllAsRead(userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}
