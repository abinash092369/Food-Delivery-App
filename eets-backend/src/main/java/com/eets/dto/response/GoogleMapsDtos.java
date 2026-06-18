package com.eets.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class GoogleMapsDtos {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record DistanceMatrixResponse(
        @JsonProperty("destination_addresses") List<String> destinationAddresses,
        @JsonProperty("origin_addresses") List<String> originAddresses,
        List<Row> rows,
        String status
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Row(List<Element> elements) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Element(
        Distance distance,
        Duration duration,
        String status
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Distance(String text, long value) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Duration(String text, long value) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record DirectionsResponse(
        List<Route> routes,
        String status,
        @JsonProperty("error_message") String errorMessage
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Route(
        List<Leg> legs,
        @JsonProperty("overview_polyline") Polyline overviewPolyline
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Leg(
        Distance distance,
        Duration duration
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Polyline(String points) {}
}
