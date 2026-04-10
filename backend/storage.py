import os
import pandas as pd
from typing import Optional

class StorageProvider:
    def __init__(self, base_dir: str = "app_data/storage"):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)

    def save_dataframe(self, session_id: str, df: pd.DataFrame):
        path = os.path.join(self.base_dir, f"{session_id}.pkl")
        df.to_pickle(path)

    def load_dataframe(self, session_id: str) -> Optional[pd.DataFrame]:
        path = os.path.join(self.base_dir, f"{session_id}.pkl")
        if os.path.exists(path):
            return pd.read_pickle(path)
        return None

    def delete_dataframe(self, session_id: str):
        path = os.path.join(self.base_dir, f"{session_id}.pkl")
        if os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass

storage = StorageProvider()
