package com.eets.repository.elasticsearch;

import com.eets.document.RestaurantDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SearchRepository extends ElasticsearchRepository<RestaurantDocument, Long> {
}
