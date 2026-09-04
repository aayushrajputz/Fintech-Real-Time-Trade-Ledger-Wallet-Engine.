package main

import (
	"fmt"
	"matching-engine/consumer"
	"matching-engine/engine"
)

func main() {
	fmt.Println("⚡ Starting High-Speed Golang Order Matching Engine Microservice...")

	// 1. Initialize In-Memory OrderBook
	orderBook := engine.NewOrderBook()

	// 2. Start Kafka Consumer (Blocking loop)
	consumer.StartKafkaConsumer(orderBook)
}

