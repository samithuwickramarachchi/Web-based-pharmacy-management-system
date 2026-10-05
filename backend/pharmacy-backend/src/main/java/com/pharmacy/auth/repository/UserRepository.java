package com.pharmacy.auth.repository;

import com.pharmacy.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u JOIN FETCH u.role WHERE u.username = :identifier OR u.email = :identifier")
    Optional<User> findByUsernameOrEmailWithRole(@Param("identifier") String identifier);

    @Query("SELECT u FROM User u WHERE u.role.name IN :roleNames")
    java.util.List<User> findByRoleNames(@Param("roleNames") java.util.List<String> roleNames);
}
