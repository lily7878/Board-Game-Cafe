package ro.boardgamecafe.core.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Background jobs, e.g. polling the AI Service for rule manuals that are still being processed. */
@Configuration
@EnableScheduling
public class SchedulingConfig {}
