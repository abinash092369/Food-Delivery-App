package com.eets.repository.elasticsearch;

import com.eets.document.CategoryDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryElasticsearchRepository extends ElasticsearchRepository<CategoryDocument, Long> {
}
