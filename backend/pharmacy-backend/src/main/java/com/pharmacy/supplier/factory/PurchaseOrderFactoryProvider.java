package com.pharmacy.supplier.factory;

import com.pharmacy.supplier.dto.PurchaseOrderRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Registry and Provider for the Purchase Order Factory Method Pattern implementations.
 * Selects the appropriate {@link PurchaseOrderFactory} creator based on order characteristics.
 */
@Component
public class PurchaseOrderFactoryProvider {

    private static final Logger log = LoggerFactory.getLogger(PurchaseOrderFactoryProvider.class);

    private final List<PurchaseOrderFactory> factories;
    private final StandardPurchaseOrderFactory standardFactory;

    public PurchaseOrderFactoryProvider(List<PurchaseOrderFactory> factories,
                                        StandardPurchaseOrderFactory standardFactory) {
        this.factories = factories;
        this.standardFactory = standardFactory;
        log.info("Initialized PurchaseOrderFactoryProvider with {} factories", factories.size());
    }

    /**
     * Resolves the matching factory for the purchase order request.
     */
    public PurchaseOrderFactory getFactory(PurchaseOrderRequest request) {
        if (factories != null) {
            for (PurchaseOrderFactory factory : factories) {
                // If it is standard factory, skip in first pass to check more specific factories first
                if (factory instanceof StandardPurchaseOrderFactory) {
                    continue;
                }
                if (factory.supports(request)) {
                    log.info("Selected specialized PO factory: {}", factory.getOrderType());
                    return factory;
                }
            }
        }
        return standardFactory;
    }
}
