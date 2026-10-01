package com.vhms.vhms.controller;

import com.vhms.vhms.model.Notification;
import com.vhms.vhms.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping
    public List<Notification> getNotifications(@RequestParam(required = false) String userId,
            @RequestParam(required = false) String userEmail) {
        if (userId != null && userEmail != null) {
            return notificationRepository.findByUserIdOrUserEmail(userId, userEmail);
        } else if (userId != null) {
            return notificationRepository.findByUserId(userId);
        } else if (userEmail != null) {
            return notificationRepository.findByUserEmail(userEmail);
        }
        return notificationRepository.findAll();
    }

    @PostMapping
    public Notification createNotification(@RequestBody Notification notification) {
        if (notification.getTimestamp() == null) {
            notification.setTimestamp("Just now");
        }
        return notificationRepository.save(notification);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable String id) {
        Optional<Notification> opt = notificationRepository.findById(id);
        if (opt.isPresent()) {
            Notification n = opt.get();
            n.setRead(true);
            notificationRepository.save(n);
            return ResponseEntity.ok(n);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@RequestParam(required = false) String userId,
            @RequestParam(required = false) String userEmail) {
        List<Notification> list;
        if (userId != null || userEmail != null) {
            list = notificationRepository.findByUserIdOrUserEmail(userId != null ? userId : "",
                    userEmail != null ? userEmail : "");
        } else {
            list = notificationRepository.findAll();
        }
        for (Notification n : list) {
            n.setRead(true);
        }
        notificationRepository.saveAll(list);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable String id) {
        notificationRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/user/{userId}")
    public ResponseEntity<Void> deleteAllForUser(@PathVariable String userId) {
        List<Notification> list = notificationRepository.findByUserId(userId);
        notificationRepository.deleteAll(list);
        return ResponseEntity.ok().build();
    }
}
