package consumer

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"matching-engine/engine"
	"matching-engine/models"

	"github.com/segmentio/kafka-go"
)

func StartKafkaConsumer(orderBook *engine.OrderBook) {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  []string{"localhost:9092"},
		Topic:    "order-events",
		GroupID:  "go-matching-group",
		MinBytes: 10 * 1024,
		MaxBytes: 10e6,
	})

	defer reader.Close()
	orderChan := make(chan models.Order, 10000)
	go func() {
		for order := range orderChan {
			orderBook.AddOrder(order)
			orderBook.MatchOrders()
		}

	}()
	fmt.Println("High-Speed Goroutine Worker Pool & Channel Listening on topic: order-events...")

	for {
		msg, err := reader.ReadMessage(context.Background())
		if err != nil {
			log.Printf(" Error reading Kafka message: %v", err)
			continue
		}

		go func(rawMsg []byte) {
			var order models.Order
			err := json.Unmarshal(rawMsg, &order)
			if err != nil {
				log.Printf(" Error parsing order JSON: %v", err)
				return
			}

			orderChan <- order
		}(msg.Value)
	}
}
