package com.pharmacy.common.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Diagnostic component to verify and log MySQL database connectivity on startup.
 */
@Component
public class DatabaseConnectionValidator implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConnectionValidator.class);
    private final DataSource dataSource;

    public DatabaseConnectionValidator(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            log.info("====================================================================");
            log.info(" [DATABASE CONNECTION SUCCESSFUL]");
            log.info(" Database Product:  {} {}", metaData.getDatabaseProductName(), metaData.getDatabaseProductVersion());
            log.info(" JDBC Driver:       {} {}", metaData.getDriverName(), metaData.getDriverVersion());
            log.info(" Connected URL:     {}", metaData.getURL());
            log.info(" Database User:     {}", metaData.getUserName());

            try (Statement stmt = connection.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT DATABASE(), COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()")) {
                if (rs.next()) {
                    String dbName = rs.getString(1);
                    int tableCount = rs.getInt(2);
                    log.info(" Active Schema:     {}", dbName);
                    log.info(" Detected Tables:   {} tables ready", tableCount);
                }
            }
            log.info("====================================================================");
        } catch (Exception e) {
            log.warn("====================================================================");
            log.warn(" [DATABASE CONNECTION NOTICE]");
            log.warn(" Could not connect to MySQL using the current configuration.");
            log.warn(" Cause: {}", e.getMessage());
            log.warn(" To connect to your local MySQL database:");
            log.warn("   1. Verify MySQL is running on localhost:3306");
            log.warn("   2. Pass your password via: set DB_PASSWORD=your_password (or $env:DB_PASSWORD='your_password')");
            log.warn("   3. Or update spring.datasource.password in application.properties");
            log.warn("====================================================================");
        }
    }
}
