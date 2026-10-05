package com.pharmacy.supplier.service;

import com.pharmacy.common.exception.DuplicateResourceException;
import com.pharmacy.common.exception.ResourceNotFoundException;
import com.pharmacy.supplier.dto.SupplierDto;
import com.pharmacy.supplier.dto.SupplierRequest;
import com.pharmacy.supplier.entity.Supplier;
import com.pharmacy.supplier.repository.SupplierRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    @Transactional(readOnly = true)
    public Page<SupplierDto> getAll(Pageable pageable) {
        return supplierRepository.findAll(pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<SupplierDto> getActive() {
        return supplierRepository.findByIsActiveTrue().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SupplierDto getById(Integer id) {
        Supplier s = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id " + id));
        return toDto(s);
    }

    public SupplierDto create(SupplierRequest req) {
        if (supplierRepository.existsByName(req.getName())) {
            throw new DuplicateResourceException("Supplier with name '" + req.getName() + "' already exists");
        }

        Supplier s = new Supplier();
        s.setName(req.getName());
        s.setContactPerson(req.getContactPerson());
        s.setPhone(req.getPhone());
        s.setEmail(req.getEmail());
        s.setAddress(req.getAddress());
        s.setIsActive(req.getIsActive() != null ? req.getIsActive() : true);

        return toDto(supplierRepository.save(s));
    }

    public SupplierDto update(Integer id, SupplierRequest req) {
        Supplier s = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id " + id));

        if (!s.getName().equalsIgnoreCase(req.getName()) && supplierRepository.existsByName(req.getName())) {
            throw new DuplicateResourceException("Supplier with name '" + req.getName() + "' already exists");
        }

        s.setName(req.getName());
        s.setContactPerson(req.getContactPerson());
        s.setPhone(req.getPhone());
        s.setEmail(req.getEmail());
        s.setAddress(req.getAddress());
        if (req.getIsActive() != null) {
            s.setIsActive(req.getIsActive());
        }

        return toDto(supplierRepository.save(s));
    }

    public void delete(Integer id) {
        Supplier s = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id " + id));
        s.setIsActive(false);
        supplierRepository.save(s);
    }

    // ─── Mapping ─────────────────────────────────────────────────────────────────

    private SupplierDto toDto(Supplier s) {
        SupplierDto dto = new SupplierDto();
        dto.setId(s.getId());
        dto.setName(s.getName());
        dto.setContactPerson(s.getContactPerson());
        dto.setPhone(s.getPhone());
        dto.setEmail(s.getEmail());
        dto.setAddress(s.getAddress());
        dto.setIsActive(s.getIsActive());
        dto.setCreatedAt(s.getCreatedAt());
        dto.setUpdatedAt(s.getUpdatedAt());
        return dto;
    }
}
