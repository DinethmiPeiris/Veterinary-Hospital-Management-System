package com.vhms.vhms.repository;

import com.vhms.vhms.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserId(String userId);

    List<Notification> findByUserEmail(String userEmail);

    List<Notification> findByUserIdOrUserEmail(String userId, String userEmail);
}
