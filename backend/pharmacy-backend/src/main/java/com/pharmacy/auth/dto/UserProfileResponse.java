package com.pharmacy.auth.dto;

import java.util.List;

public class UserProfileResponse {

    private Integer id;
    private String username;
    private String email;
    private String role;
    private List<String> authorities;

    public UserProfileResponse() {
    }

    public UserProfileResponse(Integer id, String username, String email, String role, List<String> authorities) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
        this.authorities = authorities;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public List<String> getAuthorities() {
        return authorities;
    }

    public void setAuthorities(List<String> authorities) {
        this.authorities = authorities;
    }
}
