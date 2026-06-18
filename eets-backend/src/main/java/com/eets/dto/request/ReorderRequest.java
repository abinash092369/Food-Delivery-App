package com.eets.dto.request;

import java.util.List;
public record ReorderRequest(List<Long> orderedIds) {}
