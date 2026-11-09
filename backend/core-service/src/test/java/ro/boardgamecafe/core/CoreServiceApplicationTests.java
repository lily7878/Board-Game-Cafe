package ro.boardgamecafe.core;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Starts the full application against PostgreSQL, so Flyway applies every migration and Hibernate
 * validates the entities against the resulting schema. Runs only when a database password is configured.
 */
@SpringBootTest
@EnabledIfEnvironmentVariable(named = "DB_PASSWORD", matches = ".+")
class CoreServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}
