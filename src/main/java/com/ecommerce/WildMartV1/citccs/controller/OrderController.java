package com.ecommerce.WildMartV1.citccs.controller;

import com.ecommerce.WildMartV1.citccs.model.*;
import com.ecommerce.WildMartV1.citccs.repository.CartRepository;
import com.ecommerce.WildMartV1.citccs.repository.OrderRepository;
import com.ecommerce.WildMartV1.citccs.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class OrderController {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private CartRepository cartRepository;
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/user/orders")
    public ResponseEntity<List<Order>> getUserOrders(@RequestHeader("Authorization") String token) {
        Long userId = extractUserIdFromToken(token);
        User user = userService.getUserById(userId);
        List<Order> orders = orderRepository.findByUserOrderByOrderDateDesc(user);
        return ResponseEntity.ok(orders);
    }
    
    @PostMapping("/orders/checkout")
    public ResponseEntity<Order> checkout(@RequestHeader("Authorization") String token) {
        Long userId = extractUserIdFromToken(token);
        User user = userService.getUserById(userId);
        
        Cart cart = cartRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Cart not found"));
        
        if (cart.getItems().isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }
        
        // Calculate total
        double total = cart.getItems().stream()
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();
        
        // Create order
        Order order = new Order(user, total);
        
        // Convert cart items to order items
        for (CartItem cartItem : cart.getItems()) {
            OrderItem orderItem = new OrderItem(
                order,
                cartItem.getProduct(),
                cartItem.getQuantity(),
                cartItem.getPrice()
            );
            order.getItems().add(orderItem);
        }
        
        order = orderRepository.save(order);
        
        // Clear cart
        cart.getItems().clear();
        cartRepository.save(cart);
        
        return ResponseEntity.ok(order);
    }
    
    @GetMapping("/user/purchases")
    public ResponseEntity<List<Order>> getPurchases(@RequestHeader("Authorization") String token) {
        Long userId = extractUserIdFromToken(token);
        User user = userService.getUserById(userId);
        List<Order> orders = orderRepository.findByUserOrderByOrderDateDesc(user);
        return ResponseEntity.ok(orders);
    }
    
    private Long extractUserIdFromToken(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        return Long.parseLong(token.replace("token_", ""));
    }
}
