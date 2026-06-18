package com.eets.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.Setting;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(indexName = "categories", createIndex = false)
@Setting(settingPath = "elasticsearch/settings.json")
public class CategoryDocument {
    @Id
    private Long id;

    @Field(type = FieldType.Long)
    private Long restaurantId;

    @Field(type = FieldType.Text, analyzer = "autocomplete_analyzer", searchAnalyzer = "autocomplete_search_analyzer")
    private String name;

    @Field(type = FieldType.Text, analyzer = "autocomplete_analyzer", searchAnalyzer = "autocomplete_search_analyzer")
    private String description;

    @Field(type = FieldType.Boolean)
    private Boolean isAvailable;
}
