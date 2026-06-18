package com.eets.fraud.rule;

import com.eets.fraud.context.FraudContext;
import com.eets.fraud.model.RuleResult;

import java.util.List;

public interface FraudRule {
    String getName();
    String getDescription();
    List<RuleResult> evaluate(FraudContext context);
}
