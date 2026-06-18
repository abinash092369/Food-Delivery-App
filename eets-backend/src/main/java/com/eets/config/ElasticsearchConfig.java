package com.eets.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;

@Configuration
@EnableElasticsearchRepositories(basePackages = "com.eets.repository.elasticsearch")
public class ElasticsearchConfig {
    // Spring Boot auto-configures the ElasticsearchClient and ElasticsearchTemplate.
}
