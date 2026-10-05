package com.pharmacy.inventory.service;

import com.pharmacy.common.exception.DuplicateResourceException;
import com.pharmacy.common.exception.ResourceNotFoundException;
import com.pharmacy.inventory.dto.CategoryDto;
import com.pharmacy.inventory.dto.CategoryRequest;
import com.pharmacy.inventory.entity.Category;
import com.pharmacy.inventory.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryDto> getAll() {
        return categoryRepository.findAll().stream()
                .map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryDto getById(Integer id) {
        return toDto(findCategory(id));
    }

    public CategoryDto create(CategoryRequest req) {
        if (categoryRepository.existsByName(req.getName())) {
            throw new DuplicateResourceException("Category already exists with name: " + req.getName());
        }
        Category c = new Category();
        c.setName(req.getName());
        c.setDescription(req.getDescription());
        return toDto(categoryRepository.save(c));
    }

    public CategoryDto update(Integer id, CategoryRequest req) {
        Category c = findCategory(id);
        if (!c.getName().equals(req.getName()) && categoryRepository.existsByName(req.getName())) {
            throw new DuplicateResourceException("Category already exists with name: " + req.getName());
        }
        c.setName(req.getName());
        c.setDescription(req.getDescription());
        return toDto(categoryRepository.save(c));
    }

    public void delete(Integer id) {
        Category c = findCategory(id);
        categoryRepository.delete(c);
    }

    private Category findCategory(Integer id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
    }

    private CategoryDto toDto(Category c) {
        return new CategoryDto(c.getId(), c.getName(), c.getDescription());
    }
}
