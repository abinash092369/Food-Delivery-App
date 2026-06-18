package com.eets.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.examples.Example;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.parameters.RequestBody;
import io.swagger.v3.oas.models.security.*;
import org.springframework.context.annotation.*;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("eets API")
                .version("1.0.0")
                .description("Food delivery platform backend"))
            .components(new Components()
                .addSecuritySchemes("bearerAuth",
                    new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT"))
                // Explicit request body examples — prevents Swagger double-brace wrapping bug
                .addRequestBodies("ReviewRequest", reviewRequestBody())
                .addRequestBodies("AddToCartRequest", cartRequestBody())
                .addRequestBodies("InitiateOrderRequest", initiateOrderRequestBody()))
            .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }

    private RequestBody reviewRequestBody() {
        return new RequestBody()
            .description("Create a review for a delivered order")
            .required(true)
            .content(new Content().addMediaType("application/json",
                new MediaType()
                    .schema(new Schema<>().$ref("#/components/schemas/ReviewRequest"))
                    .addExamples("default", new Example()
                        .value("""
                            {
                              "orderId": 1,
                              "rating": 5,
                              "reviewText": "Great food and fast delivery!",
                              "images": []
                            }
                            """))));
    }

    private RequestBody cartRequestBody() {
        return new RequestBody()
            .description("Add item to cart")
            .required(true)
            .content(new Content().addMediaType("application/json",
                new MediaType()
                    .schema(new Schema<>().$ref("#/components/schemas/AddToCartRequest"))
                    .addExamples("default", new Example()
                        .value("""
                            {
                              "menuItemId": 1,
                              "quantity": 1,
                              "selectedOptions": []
                            }
                            """))));
    }

    private RequestBody initiateOrderRequestBody() {
        return new RequestBody()
            .description("Initiate a new order from cart")
            .required(true)
            .content(new Content().addMediaType("application/json",
                new MediaType()
                    .schema(new Schema<>().$ref("#/components/schemas/InitiateOrderRequest"))
                    .addExamples("default", new Example()
                        .value("""
                            {
                              "addressId": 1,
                              "paymentMethod": "COD",
                              "couponCode": null,
                              "specialInstructions": ""
                            }
                            """))));
    }
}