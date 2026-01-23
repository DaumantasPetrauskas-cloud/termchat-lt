"""Core tensor operations for TermAI"""
import numpy as np

class Tensor:
    def __init__(self, data):
        self.data = np.array(data, dtype=np.float32)
        self.grad = None
    
    def __add__(self, other):
        return Tensor(self.data + other.data)
    
    def __mul__(self, other):
        return Tensor(self.data * other.data)
    
    def dot(self, other):
        return Tensor(np.dot(self.data, other.data))
    
    def sigmoid(self):
        return Tensor(1 / (1 + np.exp(-self.data)))
    
    def tanh(self):
        return Tensor(np.tanh(self.data))

def softmax(x):
    exp_x = np.exp(x.data - np.max(x.data))
    return Tensor(exp_x / np.sum(exp_x))