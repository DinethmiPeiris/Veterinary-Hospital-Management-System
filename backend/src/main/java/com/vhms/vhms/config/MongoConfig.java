package com.vhms.vhms.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;

@Configuration
public class MongoConfig {

    @Value("${spring.data.mongodb.uri:mongodb://localhost:27017/VHMS}")
    private String mongoUri;

    @Bean
    public MongoClient mongoClient() {
        try {
            MongoClientSettings settings = MongoClientSettings.builder()
                    .applyConnectionString(new ConnectionString(mongoUri))
                    .build();
            return MongoClients.create(settings);
        } catch (Exception e) {
            System.err.println("Failed to connect with URI, fallback to default: " + e.getMessage());
            return MongoClients.create(mongoUri);
        }
    }
}
