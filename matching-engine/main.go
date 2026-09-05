package main

import (
	"fmt"
	"matching-engine/consumer"
	"matching-engine/engine"
	"matching-engine/producer"
)

func main() {
	fmt.Println("⚡ Starting High-Speed Golang Order Matching Engine Microservice...")

	// 1. Initialize Kafka Producer for matched trades
	producer.InitProducer()

	// 2. Initialize In-Memory OrderBook
	orderBook := engine.NewOrderBook()

	// 3. Start Kafka Consumer (Blocking loop)
	consumer.StartKafkaConsumer(orderBook)
}

