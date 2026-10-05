package com.pharmacy.inventory.repository;

import com.pharmacy.inventory.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {
    Optional<Category> findByName(String name);
    List<Category> findByParentIsNull();
    List<Category> findByParentId(Integer parentId);
    boolean existsByName(String name);
}
