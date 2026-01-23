"""Neural network models for TermAI"""
from .core import Tensor, softmax
import numpy as np

class Linear:
    def __init__(self, in_features, out_features):
        self.weight = Tensor(np.random.randn(in_features, out_features) * 0.1)
        self.bias = Tensor(np.zeros(out_features))
    
    def forward(self, x):
        return x.dot(self.weight) + self.bias

class ChatBot:
    def __init__(self, vocab_size=1000, hidden_size=64):
        self.embed = Linear(vocab_size, hidden_size)
        self.hidden = Linear(hidden_size, hidden_size)
        self.output = Linear(hidden_size, vocab_size)
        self.vocab = {}
        self.responses = [
            "Labas! Kaip sekasi?",
            "Įdomu! Papasakok daugiau.",
            "Suprantu tave.",
            "Ačiū už pokalbį!",
            "Gal galiu kuo nors padėti?"
        ]
    
    def predict(self, message):
        # Simple rule-based responses for now
        message = message.lower()
        if "labas" in message or "hi" in message:
            return "Labas! Kaip sekasi?"
        elif "ačiū" in message or "thanks" in message:
            return "Prašom! Visada malonu padėti."
        elif "?" in message:
            return "Įdomi užklausa! Ką manai apie tai?"
        else:
            return np.random.choice(self.responses)