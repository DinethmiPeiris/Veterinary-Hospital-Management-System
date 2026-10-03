package com.vhms.vhms.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;

@Configuration
public class MongoConfig {

    @Autowired
    private Environment env;

    private String getMongoUri() {
        String uri = env.getProperty("spring.mongodb.uri");
        if (uri == null || uri.isBlank()) {
            uri = env.getProperty("spring.data.mongodb.uri");
        }
        if (uri == null || uri.isBlank()) {
            throw new IllegalStateException(
                    "spring.mongodb.uri (or spring.data.mongodb.uri) is not configured in application.properties");
        }
        return uri;
    }

    @Bean
    public MongoClient mongoClient() {
        String uri = getMongoUri();
        System.out.println("✅ Connecting MongoClient to MongoDB Atlas");
        return MongoClients.create(uri);
    }

    @Bean
    public MongoDatabaseFactory mongoDatabaseFactory() {
        System.out.println("✅ SimpleMongoClientDatabaseFactory bound to Atlas URI");
        return new SimpleMongoClientDatabaseFactory(getMongoUri());
    }
}
