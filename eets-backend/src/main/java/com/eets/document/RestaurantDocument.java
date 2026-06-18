package com.eets.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.Setting;
import org.springframework.data.elasticsearch.core.geo.GeoPoint;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(indexName = "restaurants", createIndex = false)
@Setting(settingPath = "elasticsearch/settings.json")
public class RestaurantDocument {
    @Id
    private Long id;

    @Field(type = FieldType.Text, analyzer = "autocomplete_analyzer", searchAnalyzer = "autocomplete_search_analyzer")
    private String name;

    @Field(type = FieldType.Keyword)
    private String slug;

    @Field(type = FieldType.Text, analyzer = "autocomplete_analyzer", searchAnalyzer = "autocomplete_search_analyzer")
    private String description;

    @Field(type = FieldType.Text, analyzer = "autocomplete_analyzer", searchAnalyzer = "autocomplete_search_analyzer")
    private List<String> cuisineTypes;

    @Field(type = FieldType.Keyword)
    private String coverImageUrl;

    @Field(type = FieldType.Keyword)
    private String logoUrl;

    @Field(type = FieldType.Text)
    private String addressLine;

    @Field(type = FieldType.Keyword)
    private String city;

    @Field(type = FieldType.Keyword)
    private String state;

    @Field(type = FieldType.Keyword)
    private String pincode;

    private GeoPoint location;

    @Field(type = FieldType.Boolean)
    private Boolean isOpen;

    @Field(type = FieldType.Boolean)
    private Boolean isActive;

    @Field(type = FieldType.Boolean)
    private Boolean isApproved;

    @Field(type = FieldType.Double)
    private Double avgRating;

    @Field(type = FieldType.Integer)
    private Integer totalRatings;

    @Field(type = FieldType.Integer)
    private Integer totalOrders;

    @Field(type = FieldType.Integer)
    private Integer deliveryTimeMin;

    @Field(type = FieldType.Double)
    private Double deliveryFee;

    @Field(type = FieldType.Double)
    private Double minOrderAmount;

    @Field(type = FieldType.Boolean)
    private Boolean hasVeg;
}
