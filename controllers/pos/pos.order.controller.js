const PosOrderService = require("../../services/pos/pos.order.service");

class PosOrderController {
    static async createOrder(req, res) {
        try {
            const data = await PosOrderService.createOrder(req.body, req.user);
            res.json(data);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static async sendToBarista(req, res) {
        try {
            const data = await PosOrderService.sendToBarista(
                req.params.orderId,
                req.user
            );
            res.json(data);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static async getBaristaQueue(req, res) {
        try {
            const data = await PosOrderService.getBaristaQueue();
            res.json(data);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static async updateStatus(req, res) {
        try {
            const data = await PosOrderService.updateStatus(
                req.params.orderId,
                req.body.status,
                req.user
            );
            res.json(data);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static async payOrder(req, res) {
        try {
            const { paymentMethod, amountPaid } = req.body;

            const data = await PosOrderService.payOrder(
                req.params.orderId,
                paymentMethod,
                amountPaid,
                req.user
            );

            res.json(data);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

static async cancelOrder(req, res) {
  try {
    const data = await PosOrderService.cancelOrder(
      req.params.orderId,
      req.user
    );
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

static async refundOrder(req, res) {
  try {
    const data = await PosOrderService.refundOrder(
      req.params.orderId,
      req.user
    );
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

}

module.exports = PosOrderController;
