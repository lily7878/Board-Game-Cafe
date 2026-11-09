package ro.boardgamecafe.core.config;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import ro.boardgamecafe.core.domain.staff.StaffUser;
import ro.boardgamecafe.core.repository.StaffUserRepository;

@Service
public class StaffUserDetailsService implements UserDetailsService {
    private final StaffUserRepository repository;
    public StaffUserDetailsService(StaffUserRepository repository) { this.repository = repository; }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        StaffUser staff = repository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("Unknown staff user."));
        return User.withUsername(staff.getEmail()).password(staff.getPasswordHash())
                .roles(staff.getRole().name()).disabled(!staff.isActive()).build();
    }
}
