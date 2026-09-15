package com.vhms.vhms.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping(value = "/", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> home() {
        String html = """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>VHMS API Server</title>
                    <style>
                        body {
                            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                        }
                        .container {
                            background: white;
                            padding: 3rem 4rem;
                            border-radius: 16px;
                            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                            text-align: center;
                            max-width: 500px;
                        }
                        .icon {
                            font-size: 3rem;
                            margin-bottom: 1rem;
                        }
                        h1 {
                            color: #2c3e50;
                            margin-bottom: 0.5rem;
                            font-size: 1.8rem;
                        }
                        p {
                            color: #7f8c8d;
                            line-height: 1.6;
                            margin-bottom: 2rem;
                        }
                        .btn {
                            display: inline-block;
                            background-color: #3498db;
                            color: white;
                            padding: 12px 28px;
                            text-decoration: none;
                            border-radius: 8px;
                            font-weight: 600;
                            transition: all 0.3s ease;
                            box-shadow: 0 4px 6px rgba(52, 152, 219, 0.2);
                        }
                        .btn:hover {
                            background-color: #2980b9;
                            transform: translateY(-2px);
                            box-shadow: 0 6px 12px rgba(52, 152, 219, 0.3);
                        }
                        .status {
                            display: inline-flex;
                            align-items: center;
                            background: #e8f8f5;
                            color: #1abc9c;
                            padding: 6px 16px;
                            border-radius: 20px;
                            font-size: 0.9rem;
                            font-weight: 600;
                            margin-bottom: 1.5rem;
                            border: 1px solid #1abc9c;
                        }
                        .status-dot {
                            width: 8px;
                            height: 8px;
                            background: #1abc9c;
                            border-radius: 50%;
                            margin-right: 8px;
                            animation: pulse 2s infinite;
                        }
                        @keyframes pulse {
                            0% { box-shadow: 0 0 0 0 rgba(26, 188, 156, 0.4); }
                            70% { box-shadow: 0 0 0 10px rgba(26, 188, 156, 0); }
                            100% { box-shadow: 0 0 0 0 rgba(26, 188, 156, 0); }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="icon">🐕</div>
                        <div class="status">
                            <div class="status-dot"></div>
                            API is Online & Connected
                        </div>
                        <h1>VHMS Backend Services</h1>
                        <p>Welcome to the Veterinary Hospital Management System API server. This server handles data processing in the background.</p>
                        <a href="http://localhost:5173" class="btn">Open User Interface</a>
                    </div>
                </body>
                </html>
                """;
        return ResponseEntity.ok(html);
    }
}
