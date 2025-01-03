const JoinRoomForm = ({ onJoinRoom }) => {
    return (
        <div className="card bg-base-100 shadow-xl w-full max-w-md">
            <div className="card-body">
                <h2 className="card-title">Tham gia phòng</h2>
                <div className="form-control">
                    <input 
                        type="text" 
                        placeholder="Nhập mã phòng" 
                        className="input input-bordered" 
                        id="inviteCode"
                    />
                    <button 
                        className="btn btn-primary mt-3"
                        onClick={() => {
                            const inviteCode = document.getElementById('inviteCode').value;
                            if (inviteCode) {
                                onJoinRoom(inviteCode);
                                document.getElementById('inviteCode').value = '';
                            }
                        }}
                    >
                        Tham gia
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JoinRoomForm;
