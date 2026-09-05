package engine

import (
	"fmt"
	"matching-engine/models"
	"matching-engine/producer"
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

func (ob *OrderBook) MatchOrders() {
	for len(ob.BuyOrders) > 0 && len(ob.SellOrders) > 0 {
		buy := ob.BuyOrders[0]
		sell := ob.SellOrders[0]

		if buy.Price >= sell.Price {
			fmt.Printf(" TRADE MATCHED: BUY %.2f @ %.2f ↔ SELL %.2f @ %.2f\n",
				buy.Quantity, buy.Price, sell.Quantity, sell.Price)

			tradeEvent := producer.TradeEvent{
				BuyOrderID:  buy.ID,
				SellOrderID: sell.ID,
				Symbol:      buy.Symbol,
				Price:       sell.Price,
				Quantity:    buy.Quantity,
			}
			go producer.PublishTradeEvent(tradeEvent)

			ob.BuyOrders = ob.BuyOrders[1:]
			ob.SellOrders = ob.SellOrders[1:]
		} else {
			break
		}
	}
}
