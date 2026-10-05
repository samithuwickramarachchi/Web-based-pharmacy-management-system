package com.pharmacy.auth.security;

import com.pharmacy.auth.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

public class CustomUserDetails implements UserDetails {

    private final Integer id;
    private final String username;
    private final String email;
    private final String password;
    private final String roleName;
    private final boolean isActive;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserDetails(Integer id, String username, String email, String password,
                             String roleName, boolean isActive,
                             Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.roleName = roleName;
        this.isActive = isActive;
        this.authorities = authorities;
    }

    public static CustomUserDetails create(User user) {
        Set<GrantedAuthority> authorities = new HashSet<>();
        String rawRole = user.getRole().getName();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + rawRole));

        // Support role aliases to bridge DB naming with domain role expectations
        if ("SALES_OFFICER".equalsIgnoreCase(rawRole) || "SALES_STAFF".equalsIgnoreCase(rawRole)) {
            authorities.add(new SimpleGrantedAuthority("ROLE_SALES_STAFF"));
            authorities.add(new SimpleGrantedAuthority("ROLE_SALES_OFFICER"));
        } else if ("INVENTORY_MANAGER".equalsIgnoreCase(rawRole) || "INVENTORY_STAFF".equalsIgnoreCase(rawRole)) {
            authorities.add(new SimpleGrantedAuthority("ROLE_INVENTORY_STAFF"));
            authorities.add(new SimpleGrantedAuthority("ROLE_INVENTORY_MANAGER"));
        } else if ("DELIVERY_OFFICER".equalsIgnoreCase(rawRole) || "DELIVERY_STAFF".equalsIgnoreCase(rawRole)) {
            authorities.add(new SimpleGrantedAuthority("ROLE_DELIVERY_STAFF"));
            authorities.add(new SimpleGrantedAuthority("ROLE_DELIVERY_OFFICER"));
        } else if ("SUPPLIER_OFFICER".equalsIgnoreCase(rawRole) || "SUPPLIER_STAFF".equalsIgnoreCase(rawRole)) {
            authorities.add(new SimpleGrantedAuthority("ROLE_SUPPLIER_STAFF"));
            authorities.add(new SimpleGrantedAuthority("ROLE_SUPPLIER_OFFICER"));
        }

        return new CustomUserDetails(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPasswordHash(),
                rawRole,
                Boolean.TRUE.equals(user.getIsActive()),
                authorities
        );
    }

    public Integer getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getRoleName() {
        return roleName;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isActive;
    }
}
