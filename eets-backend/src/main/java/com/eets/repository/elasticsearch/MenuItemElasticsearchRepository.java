package com.eets.repository.elasticsearch;

import com.eets.document.MenuItemDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MenuItemElasticsearchRepository extends ElasticsearchRepository<MenuItemDocument, Long> {
}
