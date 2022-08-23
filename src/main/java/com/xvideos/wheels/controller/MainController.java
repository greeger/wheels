package com.xvideos.wheels.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.xvideos.wheels.repository.UserRepository;
import com.xvideos.wheels.model.User;

@Controller
public class MainController {
    private UserRepository userRepository;

    @Autowired
    public MainController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/")
    public String home(Model model) {
        return "home";
    }

    @GetMapping("/addUserForm")
    public String userForm(Model model) {
        model.addAttribute("user", new User());
        return "addUser";
    }

    @PostMapping("/addUser")
    public String userSubmit (@ModelAttribute User user, Model model) {
        userRepository.save(user);
        model.addAttribute("user", user);
        return "result";
    }

    @GetMapping("/personalArea")
    public String personalArea(Model model) {
        //model.addAttribute("user", new User());
        return "personalArea";
    }

    @GetMapping("/admin")
    public String admin(Model model) {
        model.addAttribute("allUsers", userRepository.findAll());
        return "admin";
    }

    /*@GetMapping("/all")
    public @ResponseBody Iterable<User> getAllUsers() {
        return userRepository.findAll();
    }*/
}
