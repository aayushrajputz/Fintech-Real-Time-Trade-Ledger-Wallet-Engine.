package producer

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/segmentio/kafka-go"
)

type TradeEvent struct {
	BuyOrderID  string  `json:"buyOrderId"`
	SellOrderID string  `json:"sellOrderId"`
	Symbol      string  `json:"symbol"`
	Price       float64 `json:"price"`
	Quantity    float64 `json:"quantity"`
}

var Writer *kafka.Writer

func InitProducer() {
	Writer = &kafka.Writer{
		Addr:     kafka.TCP("localhost:9092"),
		Topic:    "trade-events",
		Balancer: &kafka.LeastBytes{},
	}
	fmt.Println(" Kafka Producer Initialized for trade-events!")
}

func PublishTradeEvent(event TradeEvent) error {
	payload, err := json.Marshal(event)
	if err != nil {
		return err
	}

	err = Writer.WriteMessages(context.Background(), kafka.Message{
		Key:   []byte(event.Symbol),
		Value: payload,
	})

	if err != nil {
		log.Printf("Failed to publish trade event to Kafka: %v", err)
		return err
	}

	fmt.Printf("[Kafka Event Published] %s %.2f @ %.2f\n", event.Symbol, event.Quantity, event.Price)
	return nil
}
