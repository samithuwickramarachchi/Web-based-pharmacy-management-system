package com.pharmacy.inventory.service;

import com.pharmacy.common.exception.DuplicateResourceException;
import com.pharmacy.common.exception.ResourceNotFoundException;
import com.pharmacy.inventory.dto.ManufacturerDto;
import com.pharmacy.inventory.dto.ManufacturerRequest;
import com.pharmacy.inventory.entity.Manufacturer;
import com.pharmacy.inventory.repository.ManufacturerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ManufacturerService {

    private final ManufacturerRepository manufacturerRepository;

    public ManufacturerService(ManufacturerRepository manufacturerRepository) {
        this.manufacturerRepository = manufacturerRepository;
    }

    @Transactional(readOnly = true)
    public List<ManufacturerDto> getAll() {
        return manufacturerRepository.findAll().stream()
                .map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ManufacturerDto getById(Integer id) {
        return toDto(findManufacturer(id));
    }

    public ManufacturerDto create(ManufacturerRequest req) {
        if (manufacturerRepository.existsByName(req.getName())) {
            throw new DuplicateResourceException("Manufacturer already exists with name: " + req.getName());
        }
        Manufacturer m = new Manufacturer();
        m.setName(req.getName());
        m.setCountry(req.getCountry());
        m.setContactEmail(req.getContactEmail());
        m.setContactPhone(req.getContactPhone());
        return toDto(manufacturerRepository.save(m));
    }

    public ManufacturerDto update(Integer id, ManufacturerRequest req) {
        Manufacturer m = findManufacturer(id);
        if (!m.getName().equals(req.getName()) && manufacturerRepository.existsByName(req.getName())) {
            throw new DuplicateResourceException("Manufacturer already exists with name: " + req.getName());
        }
        m.setName(req.getName());
        m.setCountry(req.getCountry());
        m.setContactEmail(req.getContactEmail());
        m.setContactPhone(req.getContactPhone());
        return toDto(manufacturerRepository.save(m));
    }

    public void delete(Integer id) {
        Manufacturer m = findManufacturer(id);
        manufacturerRepository.delete(m);
    }

    private Manufacturer findManufacturer(Integer id) {
        return manufacturerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Manufacturer", id));
    }

    private ManufacturerDto toDto(Manufacturer m) {
        ManufacturerDto dto = new ManufacturerDto();
        dto.setId(m.getId());
        dto.setName(m.getName());
        dto.setCountry(m.getCountry());
        dto.setContactEmail(m.getContactEmail());
        dto.setContactPhone(m.getContactPhone());
        return dto;
    }
}
