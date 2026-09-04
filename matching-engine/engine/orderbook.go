package engine

import (
	"fmt"
	"matching-engine/models"
	"sort"
)

type OrderBook struct {
	BuyOrders  []models.Order
	SellOrders []models.Order
}

func NewOrderBook() *OrderBook {
	return &OrderBook{
		BuyOrders:  []models.Order{},
		SellOrders: []models.Order{},
	}
}

func (ob *OrderBook) AddOrder(order models.Order) {
	if order.Side == "BUY" {
		ob.BuyOrders = append(ob.BuyOrders, order)
		sort.Slice(ob.BuyOrders, func(i, j int) bool {
			return ob.BuyOrders[i].Price > ob.BuyOrders[j].Price
		})
	} else {
		ob.SellOrders = append(ob.SellOrders, order)
		sort.Slice(ob.SellOrders, func(i, j int) bool {
			return ob.SellOrders[i].Price < ob.SellOrders[j].Price
		})
	}

	fmt.Printf("📥 Added: %s\n", order)
}

func (ob *OrderBook) MatchOrders() {
	for len(ob.BuyOrders) > 0 && len(ob.SellOrders) > 0 {
		buy := ob.BuyOrders[0]
		sell := ob.SellOrders[0]

		if buy.Price >= sell.Price {
			fmt.Printf(" TRADE MATCHED: BUY %.2f @ %.2f ↔ SELL %.2f @ %.2f\n",
				buy.Quantity, buy.Price, sell.Quantity, sell.Price)

			ob.BuyOrders = ob.BuyOrders[1:]
			ob.SellOrders = ob.SellOrders[1:]
		} else {
			break
		}
	}
}
