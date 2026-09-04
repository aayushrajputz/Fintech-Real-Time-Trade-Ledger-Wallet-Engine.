package models

import "fmt"

type Order struct {
	Symbol   string  `json:"symbol"`
	Side     string  `json:"side"`
	Price    float64 `json:"price"`
	Quantity float64 `json:"quantity"`
}

func (o Order) String() string {
	return fmt.Sprintf("[%s] %s %.2f @ %.4f", o.Symbol, o.Side, o.Quantity, o.Price)
}
