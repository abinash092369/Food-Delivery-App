package com.eets.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.Setting;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(indexName = "menu_items", createIndex = false)
@Setting(settingPath = "elasticsearch/settings.json")
public class MenuItemDocument {
    @Id
    private Long id;

    @Field(type = FieldType.Long)
    private Long restaurantId;

    @Field(type = FieldType.Long)
    private Long categoryId;

    @Field(type = FieldType.Text, analyzer = "autocomplete_analyzer", searchAnalyzer = "autocomplete_search_analyzer")
    private String name;

    @Field(type = FieldType.Text, analyzer = "autocomplete_analyzer", searchAnalyzer = "autocomplete_search_analyzer")
    private String description;

    @Field(type = FieldType.Double)
    private Double price;

    @Field(type = FieldType.Keyword)
    private String imageUrl;

    @Field(type = FieldType.Boolean)
    private Boolean isVeg;

    @Field(type = FieldType.Boolean)
    private Boolean isAvailable;

    @Field(type = FieldType.Boolean)
    private Boolean isFeatured;

    @Field(type = FieldType.Boolean)
    private Boolean isRecommended;

    @Field(type = FieldType.Integer)
    private Integer totalOrders;

    @Field(type = FieldType.Double)
    private Double avgRating;

    @Field(type = FieldType.Text, analyzer = "autocomplete_analyzer", searchAnalyzer = "autocomplete_search_analyzer")
    private List<String> tags;
}
