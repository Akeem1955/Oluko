package com.cm.neuronflow.config.security.auth;

import com.cm.neuronflow.internal.domain.Users;
import com.cm.neuronflow.internal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class JdbcUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;


    @Autowired
    public JdbcUserDetailsService(UserRepository userRepository){
        System.out.println("In JdbcUserDetailsService");
        this.userRepository=userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        Optional<Users> user = userRepository.findByEmail(username);
        if(user.isPresent()){
            return User.withUsername(user.get().getEmail())
                    .password(user.get().getPassword())
                    .build();
        }
        throw new UsernameNotFoundException(username);
    }

}
