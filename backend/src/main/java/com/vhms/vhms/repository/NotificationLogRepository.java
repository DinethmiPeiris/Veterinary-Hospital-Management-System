package com.vhms.vhms.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.vhms.vhms.model.NotificationLog;

@Repository
public interface NotificationLogRepository extends MongoRepository<NotificationLog, String> {

    List<NotificationLog> findByRecipientIdOrderBySentAtDesc(String recipientId);

    List<NotificationLog> findByRecipientIdAndIsReadFalseOrderBySentAtDesc(String recipientId);

    long countByRecipientIdAndIsReadFalse(String recipientId);
}
